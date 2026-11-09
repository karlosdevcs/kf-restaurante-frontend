import { Button, Chip } from '../../../components/ui'
import type { Usuario } from '../../../api/tipos'
import { cx } from '../../../lib/cx'
import { rotuloDaPermissao, rotuloDoPapel } from '../../../lib/permissoes'
import { ehSuperuser, podeGerenciar } from '../../../lib/usuarios'

export interface AcoesDaLista {
  aoEditar: (usuario: Usuario) => void
  aoDesativar: (usuario: Usuario) => void
  aoAtivar: (usuario: Usuario) => void
  aoRedefinirSenha: (usuario: Usuario) => void
  aoAbrirMinhaConta: () => void
}

function ChipDoPapel({ usuario }: { usuario: Usuario }) {
  return <Chip variante={ehSuperuser(usuario.papel) ? 'superuser' : 'papel'}>{rotuloDoPapel(usuario.papel)}</Chip>
}

function ChipsDePermissoes({ usuario }: { usuario: Usuario }) {
  if (ehSuperuser(usuario.papel)) return <span className="text-[13px] text-muted">Todas</span>
  if (usuario.permissoes.length === 0) return <span className="text-[13px] text-muted">Nenhuma</span>

  return (
    <ul aria-label={`Permissões de ${usuario.nome}`} className="flex flex-wrap gap-1">
      {usuario.permissoes.map((permissao) => (
        <li key={permissao}>
          <Chip>{rotuloDaPermissao(permissao)}</Chip>
        </li>
      ))}
    </ul>
  )
}

function Situacao({ ativo }: { ativo: boolean }) {
  return (
    <span className={cx('inline-flex items-center rounded-pilula px-[10px] py-1 text-[12px] font-bold', ativo ? 'bg-success-bg text-success-text' : 'bg-status-neutral-bg text-status-neutral-fg')}>
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function MarcaVoce() {
  return <span className="ml-2 rounded-pilula bg-canvas px-2 py-[2px] text-[11px] font-bold text-muted">Você</span>
}

// Acoes da linha: so as que a hierarquia permite. Na linha da propria pessoa, so "Minha conta".
function Acoes({ ator, usuario, acoes }: { ator: Usuario; usuario: Usuario; acoes: AcoesDaLista }) {
  if (usuario.id === ator.id) {
    return (
      <Button variante="outline" altura={36} className="px-3 text-[13px]" onClick={acoes.aoAbrirMinhaConta}>
        Minha conta
      </Button>
    )
  }
  if (!podeGerenciar(ator, usuario)) return null

  return (
    <div className="flex flex-wrap gap-2">
      <Button variante="outline" altura={36} className="px-3 text-[13px]" onClick={() => acoes.aoEditar(usuario)} aria-label={`Editar ${usuario.nome}`}>
        Editar
      </Button>
      {usuario.ativo ? (
        <Button variante="outline" altura={36} className="px-3 text-[13px]" onClick={() => acoes.aoDesativar(usuario)} aria-label={`Desativar ${usuario.nome}`}>
          Desativar
        </Button>
      ) : (
        <Button variante="outline" altura={36} className="px-3 text-[13px]" onClick={() => acoes.aoAtivar(usuario)} aria-label={`Ativar ${usuario.nome}`}>
          Ativar
        </Button>
      )}
      <Button variante="outline" altura={36} className="px-3 text-[13px]" onClick={() => acoes.aoRedefinirSenha(usuario)} aria-label={`Redefinir senha de ${usuario.nome}`}>
        Redefinir senha
      </Button>
    </div>
  )
}

export function TabelaDeUsuarios({ ator, usuarios, acoes }: { ator: Usuario; usuarios: Usuario[]; acoes: AcoesDaLista }) {
  const cabecalho = 'px-4 py-3 text-left text-[12px] font-normal tracking-[0.5px] text-muted uppercase'

  return (
    <div className="overflow-x-auto rounded-cartao border border-line-soft bg-white">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="border-b border-line-soft">
            {['Nome', 'E-mail', 'Papel', 'Permissões', 'Situação', 'Ações'].map((titulo) => (
              <th key={titulo} scope="col" className={cabecalho}>
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id} className="border-b border-line-row align-top last:border-b-0">
              <td className="px-4 py-[14px] font-semibold">
                {usuario.nome}
                {usuario.id === ator.id ? <MarcaVoce /> : null}
              </td>
              <td className="px-4 py-[14px] text-[14px] text-muted">{usuario.email}</td>
              <td className="px-4 py-[14px]">
                <ChipDoPapel usuario={usuario} />
              </td>
              <td className="px-4 py-[14px]">
                <ChipsDePermissoes usuario={usuario} />
              </td>
              <td className="px-4 py-[14px]">
                <Situacao ativo={usuario.ativo} />
              </td>
              <td className="px-4 py-[14px]">
                <Acoes ator={ator} usuario={usuario} acoes={acoes} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Celular: um cartao por usuario (fundo branco, borda ink, raio 16), mesmas informacoes, acoes empilhadas
export function CartoesDeUsuarios({ ator, usuarios, acoes }: { ator: Usuario; usuarios: Usuario[]; acoes: AcoesDaLista }) {
  return (
    <ul className="flex flex-col gap-[10px]">
      {usuarios.map((usuario) => (
        <li key={usuario.id} className="flex flex-col gap-2 rounded-cartao border border-ink bg-white p-[14px]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[16px] font-bold">
              {usuario.nome}
              {usuario.id === ator.id ? <MarcaVoce /> : null}
            </p>
            <Situacao ativo={usuario.ativo} />
          </div>
          <p className="text-[13px] text-muted">{usuario.email}</p>
          <div>
            <ChipDoPapel usuario={usuario} />
          </div>
          <ChipsDePermissoes usuario={usuario} />
          <Acoes ator={ator} usuario={usuario} acoes={acoes} />
        </li>
      ))}
    </ul>
  )
}
